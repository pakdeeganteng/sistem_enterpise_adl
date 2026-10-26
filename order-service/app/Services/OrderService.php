<?php

namespace App\Services;

use App\Clients\CartServiceClient;
use App\Clients\ProductServiceClient;
use App\Exceptions\CheckoutConflictException;
use App\Exceptions\OrderNotFoundException;
use App\Exceptions\OrderPaymentConflictException;
use App\Exceptions\ProductNotFoundException;
use App\Exceptions\ServiceCommunicationException;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use OverflowException;
use Throwable;

class OrderService
{
    private const MAX_AMOUNT_CENTS = 999_999_999_999;

    public function __construct(
        private readonly CartServiceClient $cartServiceClient,
        private readonly ProductServiceClient $productServiceClient,
    ) {}

    public function checkout(int $userId): Order
    {
        $cart = $this->cartServiceClient->getCart($userId);

        if ($cart['items'] === []) {
            Log::warning('Checkout rejected because the cart is empty.', [
                'operation' => 'checkout',
                'user_id' => $userId,
                'service' => 'Cart Service',
            ]);

            throw new CheckoutConflictException('Keranjang kosong', [
                'cart' => ['Keranjang tidak memiliki item'],
            ]);
        }

        $items = [];
        $totalCents = 0;

        foreach ($cart['items'] as $cartItem) {
            try {
                $product = $this->productServiceClient->getProduct($cartItem['product_id']);
            } catch (ProductNotFoundException $exception) {
                Log::warning('Checkout rejected because a cart product was not found.', [
                    'operation' => 'checkout',
                    'user_id' => $userId,
                    'product_id' => $cartItem['product_id'],
                    'service' => 'Product Service',
                ]);

                throw new CheckoutConflictException('Produk di keranjang tidak ditemukan', [
                    'product_id' => [$cartItem['product_id']],
                ], $exception);
            }

            if ($cartItem['quantity'] > $product['stock']) {
                Log::warning('Checkout rejected because product stock is insufficient.', [
                    'operation' => 'checkout',
                    'user_id' => $userId,
                    'product_id' => $cartItem['product_id'],
                    'product_name' => $product['name'],
                    'requested_quantity' => $cartItem['quantity'],
                    'available_stock' => $product['stock'],
                    'service' => 'Product Service',
                ]);

                throw new CheckoutConflictException('Stok produk tidak mencukupi', [
                    'stock' => [
                        'product_name' => $product['name'],
                        'requested_quantity' => $cartItem['quantity'],
                        'available_stock' => $product['stock'],
                    ],
                ]);
            }

            $unitPriceCents = $this->priceToCents($product['price']);
            $subtotalCents = $this->multiplyAmounts($unitPriceCents, $cartItem['quantity']);
            $totalCents = $this->addAmounts($totalCents, $subtotalCents);

            $items[] = [
                'product_id' => $cartItem['product_id'],
                'product_name' => $product['name'],
                'unit_price' => $this->formatAmount($unitPriceCents),
                'quantity' => $cartItem['quantity'],
                'subtotal' => $this->formatAmount($subtotalCents),
            ];
        }

        $order = DB::transaction(function () use ($userId, $items, $totalCents): Order {
            $order = Order::query()->create([
                'user_id' => $userId,
                'status' => 'PENDING',
                'total_amount' => $this->formatAmount($totalCents),
            ]);

            $order->items()->createMany($items);

            return $order->load('items');
        });

        try {
            $this->cartServiceClient->clearCart($userId);
        } catch (Throwable $exception) {
            Log::error('Order was saved, but the cart could not be cleared.', [
                'operation' => 'clear_cart_after_checkout',
                'service' => 'Cart Service',
                'order_id' => $order->id,
                'user_id' => $userId,
                'exception' => $exception::class,
                'error' => $exception->getMessage(),
            ]);
        }

        return $order;
    }

    public function getOrder(int $orderId): Order
    {
        $order = Order::query()->with('items')->find($orderId);

        if ($order === null) {
            throw new OrderNotFoundException($orderId);
        }

        return $order;
    }

    public function getUserOrders(int $userId, ?string $status = null)
    {
        return Order::query()
            ->with('items')
            ->where('user_id', $userId)
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->get();
    }

    public function markPaid(int $orderId): Order
    {
        return DB::transaction(function () use ($orderId): Order {
            $order = Order::query()->with('items')->lockForUpdate()->find($orderId);

            if ($order === null) {
                throw new OrderNotFoundException($orderId);
            }

            if ($order->status !== 'PENDING') {
                Log::warning('Payment status transition was rejected.', [
                    'operation' => 'mark_order_paid',
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'status' => $order->status,
                    'service' => 'Order Service',
                ]);

                throw new OrderPaymentConflictException($order->status);
            }

            $order->status = 'PAID';
            $order->save();

            return $order->load('items');
        });
    }

    private function priceToCents(int|float|string $price): int
    {
        if (is_float($price)) {
            throw new ServiceCommunicationException('Product Service', 'product price must be an exact decimal value');
        }

        $price = (string) $price;

        if (! preg_match('/^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/', $price, $matches)) {
            throw new ServiceCommunicationException('Product Service', 'product price is not a valid decimal amount');
        }

        $whole = (int) $matches[1];
        $fraction = (int) str_pad($matches[2] ?? '', 2, '0');

        if ($whole > intdiv(self::MAX_AMOUNT_CENTS - $fraction, 100)) {
            throw new ServiceCommunicationException('Product Service', 'product price exceeds the supported amount');
        }

        return ($whole * 100) + $fraction;
    }

    private function multiplyAmounts(int $unitPriceCents, int $quantity): int
    {
        if ($unitPriceCents > 0 && $quantity > intdiv(self::MAX_AMOUNT_CENTS, $unitPriceCents)) {
            throw new OverflowException('Order item subtotal exceeds DECIMAL(12, 2) capacity');
        }

        return $unitPriceCents * $quantity;
    }

    private function addAmounts(int $totalCents, int $subtotalCents): int
    {
        if ($subtotalCents > self::MAX_AMOUNT_CENTS - $totalCents) {
            throw new OverflowException('Order total exceeds DECIMAL(12, 2) capacity');
        }

        return $totalCents + $subtotalCents;
    }

    private function formatAmount(int $amountCents): string
    {
        return intdiv($amountCents, 100).'.'.str_pad((string) ($amountCents % 100), 2, '0', STR_PAD_LEFT);
    }
}

<?php

namespace App\Http\Controllers;

use App\Exceptions\CheckoutConflictException;
use App\Exceptions\OrderNotFoundException;
use App\Exceptions\OrderPaymentConflictException;
use App\Exceptions\ServiceCommunicationException;
use App\Http\Requests\ListUserOrdersRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->checkout($request->validated()['user_id']);

            return response()->json([
                'message' => 'Pesanan berhasil dibuat',
                'data' => new OrderResource($order),
            ], 201);
        } catch (CheckoutConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors,
            ], 409);
        } catch (ServiceCommunicationException $exception) {
            Log::warning('Order checkout could not communicate with a dependent service.', [
                'operation' => 'checkout',
                'user_id' => $request->validated()['user_id'],
                'service' => $exception->service,
                'exception' => $exception::class,
                'error' => $exception->getMessage(),
            ]);

            $body = [
                'message' => 'Layanan terkait tidak dapat dihubungi',
            ];

            if (config('app.debug')) {
                $body['error'] = $exception->getMessage();
                $body['service'] = $exception->service;
            }

            return response()->json($body, 503);
        } catch (Throwable $exception) {
            Log::error('Unexpected error while creating an order.', [
                'operation' => 'checkout',
                'user_id' => $request->validated()['user_id'],
                'service' => 'Order Service',
                'exception' => $exception::class,
                'error' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            $body = [
                'message' => 'Gagal membuat pesanan',
            ];

            if (config('app.debug')) {
                $body['error'] = $exception->getMessage();
                $body['exception'] = $exception::class;
                $body['location'] = $exception->getFile().':'.$exception->getLine();
            }

            return response()->json($body, 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Berhasil mengambil pesanan',
                'data' => new OrderResource($this->orderService->getOrder($id)),
            ]);
        } catch (OrderNotFoundException $exception) {
            return response()->json(['message' => $exception->getMessage()], 404);
        } catch (Throwable $exception) {
            return $this->unexpectedError($exception, 'mengambil pesanan', ['order_id' => $id]);
        }
    }

    public function indexByUser(ListUserOrdersRequest $request, int $userId): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Berhasil mengambil daftar pesanan',
                'data' => OrderResource::collection($this->orderService->getUserOrders(
                    $userId,
                    $request->validated()['status'] ?? null,
                )),
            ]);
        } catch (Throwable $exception) {
            return $this->unexpectedError($exception, 'mengambil daftar pesanan', ['user_id' => $userId]);
        }
    }

    public function pay(int $id): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Pesanan berhasil dibayar',
                'data' => new OrderResource($this->orderService->markPaid($id)),
            ]);
        } catch (OrderNotFoundException $exception) {
            return response()->json(['message' => $exception->getMessage()], 404);
        } catch (OrderPaymentConflictException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (Throwable $exception) {
            return $this->unexpectedError($exception, 'memperbarui status pesanan', ['order_id' => $id]);
        }
    }

    /**
     * @param  array<string, int>  $context
     */
    private function unexpectedError(Throwable $exception, string $action, array $context = []): JsonResponse
    {
        Log::error("Unexpected error while {$action}.", [
            'operation' => $action,
            'service' => 'Order Service',
            'exception' => $exception::class,
            ...$context,
            'error' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ]);

        $body = [
            'message' => "Gagal {$action}",
        ];

        if (config('app.debug')) {
            $body['error'] = $exception->getMessage();
            $body['exception'] = $exception::class;
            $body['location'] = $exception->getFile().':'.$exception->getLine();
        }

        return response()->json($body, 500);
    }
}

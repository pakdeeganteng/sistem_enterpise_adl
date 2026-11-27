<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return OrderResource::collection(Order::with('items')->latest()->paginate(15));
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        $order = DB::transaction(function () use ($data): Order {
            $order = Order::create([
                'user_id' => $data['user_id'],
                'status' => $data['status'] ?? 'pending',
            ]);
            $order->items()->createMany($data['items']);

            return $order;
        });

        return (new OrderResource($order->load('items')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load('items'));
    }

    public function update(UpdateOrderRequest $request, Order $order): OrderResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $order): void {
            if (array_key_exists('status', $data)) {
                $order->update(['status' => $data['status']]);
            }

            if (array_key_exists('items', $data)) {
                $order->items()->delete();
                $order->items()->createMany($data['items']);
            }
        });

        return new OrderResource($order->load('items'));
    }

    public function destroy(Order $order): Response
    {
        $order->delete();

        return response()->noContent();
    }
}

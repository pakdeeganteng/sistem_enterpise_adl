<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/user/{userId}', [OrderController::class, 'indexByUser'])->whereNumber('userId');
Route::patch('/orders/{id}/pay', [OrderController::class, 'pay'])->whereNumber('id');
Route::get('/orders/{id}', [OrderController::class, 'show'])->whereNumber('id');

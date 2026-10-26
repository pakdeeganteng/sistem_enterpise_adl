<?php

namespace App\Exceptions;

use RuntimeException;

class OrderPaymentConflictException extends RuntimeException
{
    public function __construct(string $status)
    {
        parent::__construct(
            $status === 'PAID' ? 'Pesanan sudah dibayar' : 'Pesanan tidak dapat dibayar dari status saat ini',
            409,
        );
    }
}

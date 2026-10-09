<?php

namespace App\Exceptions;

use RuntimeException;

class CartItemNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Item keranjang dengan id {$id} tidak ditemukan");
    }
}

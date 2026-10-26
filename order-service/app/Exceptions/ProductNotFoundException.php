<?php

namespace App\Exceptions;

use RuntimeException;

class ProductNotFoundException extends RuntimeException
{
    public readonly int $httpStatus;

    public function __construct(int $productId)
    {
        $this->httpStatus = 404;

        parent::__construct("Product {$productId} was not found", 404);
    }
}

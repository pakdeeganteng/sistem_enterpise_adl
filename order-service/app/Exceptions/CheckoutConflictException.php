<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

class CheckoutConflictException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $errors
     */
    public function __construct(string $message, public readonly array $errors = [], ?Throwable $previous = null)
    {
        parent::__construct($message, 409, $previous);
    }
}

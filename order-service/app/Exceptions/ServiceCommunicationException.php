<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

class ServiceCommunicationException extends RuntimeException
{
    public readonly int $httpStatus;

    public function __construct(
        public readonly string $service,
        string $reason,
        ?Throwable $previous = null,
    ) {
        $this->httpStatus = 503;

        parent::__construct("Unable to communicate with {$service}: {$reason}", 503, $previous);
    }
}

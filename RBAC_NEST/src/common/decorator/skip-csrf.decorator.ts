import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/** Use on routes that should bypass CSRF validation (e.g. public API endpoints using Bearer tokens). */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

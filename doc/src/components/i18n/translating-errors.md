# Translating Errors

To handle an API error, use the hook or use the TranslatedError component. If you can call the TranslatedError component, you should prefer that:

```typescript
import { TranslatedError } from "@revolt/i18n";

<TranslatedError error={someErrorObject} />
```

To use the hook:

```typescript
import { useError } from "@revolt/i18n";

const err = useError();

<span>{err(someErrorObject)}</span>
```

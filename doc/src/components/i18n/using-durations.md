# Using Durations

For-web uses Intl for duration presentation. To display durations to the user, use the useDurationFormat hook:

```typescript
import { useDurationFormat } from "@revolt/i18n/durations";

function Component() {
  const duration = useDurationFormat();

  // Will display "67 seconds" in the users locale.
  return <span>A funny amount of seconds is: {duration({seconds: 67})}</span>
}
```

The hook defaults to long formatting. You can pass all standard Intl.DurationFormatOptions options to the duration function.

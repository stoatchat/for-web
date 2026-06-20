# Feature Detection

Any feature that may not be present on all platforms should have a feature detection added to the Device hook if it will be used in more than one location. A few examples of feature detection:

- Notifications are only supported on desktop browsers
- Touch is only supported on devices with touch
- On screen keyboard management is only supported on newer Chrome based browsers on mobile
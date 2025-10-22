# Code Guidelines

This repository uses prettier which does most of the heavy lifting for you, but there are some things below to keep in mind.

Before reading additional recommendations below, I recommend checking out the [Airbnb JavaScript style guide](https://github.com/airbnb/javascript).

I am still working on putting stuff together, but here are some important things:

- Do not destruct (reactive) Solid.js props under any circumstance! Use `splitProps`.
- Follow the variable / function / class naming conventions in the Airbnb style guide.
- This project uses 2-space indentation, don't ask me why it just happened.
- Comment above all classes, constants, Solid components, constructors, methods which do not override the parent class and functions.
- If you have relatively long and / or complex code, either explain what it does in the method / function comment or in-line reasonable comments throughout to make it easy to follow through.
- Avoid importing external libraries in more than one component, re-export where appropriate.
- Import only types where necessary, such as `stoat.js` in `@revolt/ui`.

Also another major thing: **accessibility!**

- Use semantic HTML everywhere.
- Use suitable aria labels and the like when necessary.
- Build UI with keyboard navigation and screen readers in mind.

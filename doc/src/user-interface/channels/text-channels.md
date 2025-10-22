# Text Channels

## Message Grouping Algorithm

Within this algorithm, **tail** refers to whether the message omits displaying the user's avatar / username.

This algorithm expects that the rendering of the output list is reversed, if you need it from oldest to newest: either reverse at the end or adapt the logic.

1. Let **L** be the list of messages ordered from newest to oldest
2. Let **E** be the list of elements to be rendered
3. For each message **M** in **L**:
   1. Let **tail** be true
   2. Let **date** be null
   3. Let **next** be the next item in list **L**
   4. If **next** is not null:
      1. Let **adate** and **bdate** be the times the message **M** and the **next** message were created respectively
      2. If **adate** and **bdate** are not the same day:
         1. Let **date** be **adate**
      3. Let **tail** be false if one of the following conditions is satisfied:
         - Message **M** and **last** do not have the same author
         - The difference between **bdate** and **adate** is equal to or over 7 minutes
         - The masquerades for message **M** and **last** do not match
         - Message **M** or **last** is a system message
         - Message **M** replies to one or more messages
   5. Else if **next** is null:
      1. Let **tail** be false
   6. Push the message to list **E** <br> (type id: 0; cache key: _message id:tail_)
   7. If **date** is not null:
      1. Push **date** formatted as "MMMM D, YYYY" to list **E** <br> (type id: 1; cache key: _formatted date_)

_Note: the Stoat client also caches the objects produced for list **E** by pushing each object into a Map by their given cache key above, then retrieving them the next time the code is run OR creating a new object if one is not present. This prevents Solid.js from completely rebuilding the DOM whenever the message list updates._

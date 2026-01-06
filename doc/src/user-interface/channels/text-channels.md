# Text Channels

## Message Grouping Algorithm

Within this algorithm, **tail** refers to whether the message omits displaying the user's avatar / username.

This algorithm expects that the rendering of the output list is reversed, if you need it from oldest to newest: either reverse at the end or adapt the logic.

1. Let **L** be the list of messages ordered from newest to oldest
2. Let **E** be the list of elements to be rendered
3. Let **blockedMessages** be a counter initialized to 0
4. Let **insertedUnreadDivider** be a flag initialized to false
5. Let **lastReadId** be the ID of the last read message (or "0" if none)
6. For each message **M** in **L**:
   1. Let **tail** be true
   2. Let **date** be null
   3. Let **next** be the next item in list **L**
   4. If **next** is not null:
      1. Let **adate** and **bdate** be the times the message **M** and the **next** message were created respectively
      2. If **adate** and **bdate** are not the same day:
         1. Let **date** be **adate**
      3. Let **tail** be false if one of the following conditions is satisfied:
         - Message **M** and **next** do not have the same author
         - The difference between **bdate** and **adate** is equal to or over 7 minutes (420000ms)
         - The masquerades for message **M** and **next** do not match
         - Message **M** or **next** is a system message
         - Message **M** replies to one or more messages
         - **next** is before the last read message and the unread divider hasn't been inserted yet
   5. Else if **next** is null:
      1. Let **tail** be false
   6. If the unread divider hasn't been inserted and message **M** is before the last read message:
      1. Let **insertedUnreadDivider** be true
      2. Push an unread divider to list **E** <br> (type id: 1; cache key: _true_)
   7. If the author of message **M** has a "Blocked" relationship:
      1. Increment **blockedMessages**
   8. Else:
      1. If **blockedMessages** > 0:
         1. Push blocked message count to list **E** <br> (type id: 2; count: _blockedMessages_)
         2. Reset **blockedMessages** to 0
      2. Push the message to list **E** <br> (type id: 0; cache key: _message id:tail_)
   9. If **date** is not null:
      1. Push **date** formatted as "MMMM D, YYYY" to list **E** <br> (type id: 1; cache key: _formatted date_)
7. If **blockedMessages** > 0 after processing all messages:
   1. Push blocked message count to list **E** <br> (type id: 2; count: _blockedMessages_)
8. If the first element in **E** is an unread divider (type id: 1):
   1. Remove it from **E** (to avoid showing it alone at the bottom)

### Element Type IDs

- **Type 0**: Message entry with tail flag and message content
- **Type 1**: Message divider (either date divider or unread divider)
- **Type 2**: Blocked messages counter showing the number of consecutive blocked messages

_Note: the Stoat client also caches the objects produced for list **E** by pushing each object into a Map by their given cache key above, then retrieving them the next time the code is run OR creating a new object if one is not present. This prevents Solid.js from completely rebuilding the DOM whenever the message list updates._

## Message View

The message view is finnicky but important to get right, below is the high-level specification:
- The message chunk size is 50.
- A skeleton of messages is displayed where no messages have been loaded and may appear.
  This includes before initial load, at the top of the list (if more can be loaded), and at the bottom of the list (if more can be loaded).
- If there are no more messages at the top of the channel, there is a conversation start indicator.
- On initial load, a chunk of messages is requested.
- Scroll position is sticky to the bottom of the message view.
- New messages are added to the end when at the bottom of the message view.
- Messages are updated when edited or deleted.
- Scroll position is stable when loading / unloading messages.
- Scrolling into the top or bottom skeletons should load more messages in that direction.
- Up to 150 messages should be rendered (on or off screen) at any given moment.
- Ability to jump and centre to a particular message / unread message.
- Ability to jump to the latest messages.
- On failure to load messages, there should be an exponential backoff.
- There should be locks & signals that prevent double-fetching and cancel unrelated fetches if a new fetch (e.g. up instead of down, end instead of up/down) is initiated.

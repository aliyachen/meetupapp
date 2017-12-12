# meetups

This app allows users to record their meetups. 

### Current Features
* Register and login to access personal meetups
* Create a meetup (name, participants, type, start date, end date, location, notes)
* Edit meetup (edit current details, upload/change multiple images), delete, archive, or restore meetups
* View meetups individually, view all meetups on one page, or view meetups by type (meetups are sorted by date and time in ascending order)
* Set date/time using Datetimepicker API; set location using Google Places Autocomplete API
* Get Google map directions for meetup location using Google Place Autocomplete and Directions API
* View all meetups on a calendar using FullCalendar API
* View gallery (images are sorted in descending order by meetup date) 
* View other users/friends/friend requests, request, accept, or remove friends
* Profile features: add profile picture, view current and past meetups, view friends list, view calendar; if friends with another user, view that user's profile
* If another user's username is listed as a participant, the meetup is automatically added to the user's list

### To Fix 
* Keep previous value of meetup type as placeholder when editing a meetup
* Bootstrap, Materialize CSS on create, edit, profile pages overriding personal CSS
* Simplify code 

### Possible Improvements
* Send email notifications for meetups, friend requests, etc.
* Separate categories for meetups user has created and meetups user was added to
* Send notification when participant is added to a meetup; instead of being added immediately, send as an invite; participant is added if invite is accepted?
* Delete images from a meetup, also delete images from storage if meetup is deleted
* Click/expand image on meetup view
* Option to manually type in value for "Other" option for meetup type 
* Display weather forecast for each meetup
* Connect Facebook profile
* Chatting
* Option to comment on a meetup

### Frameworks
* Node.js
* Express
* MongoDB
* Handlebars

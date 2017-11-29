# meetups

This app allows users to record their meetups. 

### Current Features
* Register and login to access personal meetups
* Create a meetup (name, participants, type, start date, end date, location, notes)
* Edit meetup (edit current details, upload/change image), delete, archive, or restore meetups
* View meetups individually, view all meetups on one page, or view meetups by type (meetups are sorted by date and time in ascending order)
* Set date/time using Datetimepicker API; set location using Google Places Autocomplete API
* Get Google map directions for meetup location using Google Place Autocomplete and Directions API
* View all meetups on a calendar using FullCalendar API
* View gallery (images are sorted in descending order by meetup date) 

### To Fix 
* Captions in image gallery = date or link to meetup
* Meetups not showing up on calendar (fix string parsing?)
* Error messages for registering/logging in not showing up
* Keep previous value of meetup type as placeholder when editing a meetup
* Bootstrap CSS on create and edit pages overriding personal CSS

### Possible To Do
* Add multiple images to a meetup
* Delete images from a meetup, also delete images from storage if meetup is deleted
* Click/expand image on meetup view, lightbox/slides for image gallery
* Improve CSS/design (fade in, scroll animations, etc.)
* Form input for "recap" after a meetup is archived
* Option to manually type in value for "Other" option for meetup type 
* Display list of meetups on left and view meetups on right; all on same page 
* Display weather forecast for each meetup
* Send user an email/text message on date of meetup as reminder
* Connect Facebook profile
* User interaction: profiles, chatting, adding other users to a meetup, mutuals

### Frameworks
* Node.js
* Express
* MongoDB
* Handlebars

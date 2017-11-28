# meetups

This app allows users to record their meetups. 

### Current Features
* Register and login
* Create a meetup (name, participants, type, start date, end date, location, notes)
* Edit meetup (edit any of the current details, as well as upload images)
* View meetups individually, view all meetups on one page, or view meetups by type 
* Set date/time using Datetimepicker API; set location using Google Places Autocomplete API
* Get Google map directions for meetup location using Google Place Autocomplete and Directions API
* View all meetups on a calendar using FullCalendar API
* Delete meetups
* Archive or restore meetups
* View gallery 

### To Fix 
* Required fields on form returning false for date, location (remove required fields?)
* Captions = date for image gallery; also format gallery so that images are side by side
* Meetups not showing up on calendar (fix string parsing?)
* Error messages for registering/logging in not showing up
* Keep previous value of meetup type as placeholder when editing a meetup
* Must re-add image every time details of meetup are edited; move add image function to new page
* Background image fade-in not showing up
* Bootstrap CSS on create and edit pages overriding personal CSS

### To Do
* Sort meetups by date in ascending order
* Add multiple images to a meetup
* Click/expand image on meetup view
* Improve CSS/design (fade in, scroll animations, etc.)
* Display list of meetups on left and view meetups on right; all on same page (tentative)
* Display weather forecast for each meetup (tentative)
* Give user option to set a default home address (set as start location) (tentative)
* Send user an email/text message on date of meetup as reminder (tentative)

### Frameworks
* Node.js
* Express
* MongoDB
* Handlebars

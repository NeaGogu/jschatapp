const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled
  const scrolledOffset = $messages.scrollTop + visibleHeight; // ammount I have scrolled from the bottom

  if (Math.round(containerHeight - newMessageHeight - 1) <= Math.round(scrolledOffset)) { 
    $messages.scrollTop = $messages.scrollHeight;
  }

  
}

document.querySelector('#scrollButton').addEventListener('click', () => {
  $messages.scrollTop = $messages.scrollHeight;
})

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

socket.on('locationMessage', (locationLink) => {
  const html = Mustache.render(locationTemplate, {
    username: locationLink.username,
    locationLink: locationLink.url,
    createdAt: moment(locationLink. createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })

  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) =>{
  e.preventDefault();
  $messageFormButton.setAttribute('disabled', 'disabled');
  // disable

  const message = e.target.elements.message.value;
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    // enable

    if(error) {
      return console.log(error);
    }

    console.log('Message delivered!');
  } );
} )

document.querySelector('#send-location').addEventListener('click', () => {
  if(!navigator.geolocation) {
    return alert('Geolocation not supported by browser');
  }
  $locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {lat: position.coords.latitude, long: position.coords.longitude}, () => {
      console.log('location shared!');
      $locationButton.removeAttribute('disabled');
    });
  })
})

socket.emit('join', {username, room}, (error) => {
  if (error) {
    alert(error);
    location.href = '/' // send the user back to the join page
  }
})
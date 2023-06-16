$(document).ready(function () {
  showSenderNameModalIfNoSenderName().then(function () {
    // Receive and display new messages
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://${window.location.hostname}:7157/api/`, {
        configureLogging: "warn",
        withHandshakeResponseTimeout: 3000000

      })
      .configureLogging(signalR.LogLevel.Information)
      .build();


    // Generating key
    const key = CryptoJS.enc.Utf8.parse(generateRandomKey());
    const iv = CryptoJS.enc.Utf8.parse(generateRandomKey());

    //DEBUG: display key in document
    displayKeyAndAddEventListener(key);
    addEventToSendMessage(key, iv);
    initConnectionEvents(connection, getSenderName());
  });

  addEnterEventListenerToInput();
});

/**
 * Function to initialize the connection events
 * @param {HubConnection} connection
 * @param {string} senderName defaults to the saved sender name in localStorage
*/
function initConnectionEvents(connection, senderName = getSenderName()) {

  // Define the public key
  const publicKey = 'your_public_key_value';

  // Save the public key in localStorage
  localStorage.setItem('publicKey', publicKey);


  // Start the connection
  // This event is triggered when the connection is established
  connection.start().then(() => {

    showNotification('SignalR Connected!', 'success');

    showNotification('Performing Handshake...', 'info');
    // Perform handshake by sending the public key to the server
    connection.invoke('PerformHandshake', publicKey)
      .then(() => {
        // Handshake completed, invoke ReceiveHandshake on the server
        connection.invoke('ReceiveHandshake', handshakeInfo)
          .then(() => {
            showNotification('SignalR Handshake completed!', 'success');
          })
          .catch((error) => {
            showNotification(`Error invoking ReceiveHandshake: ${error}`, 'error');
          });
      })
      .catch((error) => {
        showNotification(`Error invoking PerformHandshake: ${error}`, 'error');
      });

  }).catch((err) => {
    return showNotification(err.toString(), 'error');
  });


  // Receive new message
  // This event is triggered when a new message is received
  connection.on('newMessage', (m) => {
    const decryptedMessage = decryptMessage(m.EncryptedContent, m.Key, m.Iv);

    const messageElement = $("<p>")
      .addClass("message")
      .addClass(m.Sender === senderName ? "userMessage" : "")
      .hide()
      .text(`${m.Sender}: ${decryptedMessage}`);

    // Apply fade-in effect to the new message
    messageElement.fadeIn(500);
    showNotification('Message received!', 'info');

    $('#viewMessages').append(messageElement);

  });

  connection.on('ReceiveHandshake', (handshakeVariable) => {
    // Handle the received handshakeVariable
    console.log('Received handshake variable:', handshakeVariable);
    // Perform any necessary actions based on the handshake variable
  });

}

function generateKeys() {

}


function showSenderNameModalIfNoSenderName(modal = $("#myModal")) {
  return new Promise(function (resolve, reject) {
    if (getSenderName() === null) {
      const senderNameSetBtn = modal.find('#setSenderNameBtn');
      modal.show();

      //escape multiple event bindings
      senderNameSetBtn.off("click");
      senderNameSetBtn.on("click", function (event) {
        updateSenderName(modal);
        resolve();
        //fade out modal
        modal.fadeOut();
      });
    } else {
      resolve();
    }
  });
}

function updateSenderName(modal) {
  const senderName = modal.find("#senderNameInput").val();
  if (senderName) {
    setSenderName(senderName);
  }
}

/**
 * save the sender name in localStorage
 * @param {string} value
*/
function setSenderName(value) {
  localStorage.setItem("sender-name", value);
}

/**
 * remove the sender name from localStorage
*/
function removeSenderName() {
  localStorage.removeItem("sender-name");
}

/**
 *  get the sender name from localStorage
 * @returns {string} senderName
*/
function getSenderName() {
  const sender = localStorage.getItem("sender-name");
  if (sender === null) {
    showNotification('Sender name in localStorage is not set.', 'error');
  }
  return sender;
}

/**
 * Function to generate a random key
 * @param {number} length - Length of the key in bytes (default: 16 bytes = 128 bits)
 * @returns {string} key
 * 
*/
function generateRandomKey(length = 16) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let x = 0; x < length; x++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return key;
}

/**
 * Function to encrypt the message
 * @param {string} message
 * @param {string} key
 * @param {string} iv
 * @returns {string} encryptedMessage
 *  
*/

function encryptMessage(message, key, iv) {
  // Encrypt the message using AES
  const encrypted = CryptoJS.AES.encrypt(message, key, { iv: iv });

  // Return the encrypted message as a base64-encoded string
  return encrypted.toString();
}

/**
 * Function to send a message
 * @param {string} secretKey
 * @param {string} iv
 * @param {JQuery Object} sendBtn
 * 
*/
function addEventToSendMessage(secretKey, iv, sendBtn = $("#sendBtn"),) {
  sendBtn.click(function () {
    const inputEl = $('#inputSend')
    const message = inputEl.val();

    // Check if the message is empty
    if (message.trim() === "") {
      // Display an error message or take appropriate action
      showNotification('Message is empty. Please enter a message.', 'error');
      return;
    }

    // Encrypt the message
    const encryptedMessage = encryptMessage(message, secretKey, iv);

    const messageData = {
      Sender: getSenderName(),
      EncryptedContent: encryptedMessage,
      Key: secretKey.toString(CryptoJS.enc.Utf8),
      Iv: iv.toString(CryptoJS.enc.Utf8)
    };
    console.log(messageData);

    fetch(`http://${window.location.hostname}:7157/api/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    })
      .then(response => console.log(response))

    inputEl.val("");
  });
}



/**
 * Function to decrypt the message
 * @param {string} encryptedMessage
 * @param {string} encKey
 * @param {string} encIv 
 * @returns {string} decryptedMessage
 */
function decryptMessage(encryptedMessage, encKey, encIv) {
  // Convert the key and iv strings to WordArray objects
  const key = CryptoJS.enc.Utf8.parse(encKey);
  const iv = CryptoJS.enc.Utf8.parse(encIv);

  // Decrypt the message using AES
  const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key, { iv: iv });

  // Convert the decrypted WordArray to a UTF-8 string
  const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);

  showNotification('Message decrypted! :\n'+ decryptedMessage, 'success');

  return decryptedMessage;
}


/**
 * Function to display the encryption key on the website
 * @param {string} key
 * @returns {HTMLElement} keyElement
  */
function displayKeyAndAddEventListener(key) {
  const keyElement = document.getElementById('keyElement');
  keyElement.textContent = 'Encryption Key: ' + key;


  $(keyElement).on("click", function () {
    navigator.clipboard.writeText(key);
    showNotification('Copied key to clipboard.', 'success');
  });

  return keyElement;
}


function addEnterEventListenerToInput(inputEl = $('#inputSend'), sendBtn = $("#sendBtn")) {
  inputEl.on('keydown', function (e) {
    if (e.which == 13 || e.keyCode == 13 || e.key === "Enter") {
      sendBtn.click();
    }
  })
}

/**
 * Function to display notifications
 * @param {string} message
 * @param {string} type
 * @returns {HTMLElement} toastr[type](message)
  */
function showNotification(message, type) {
  toastr.options = {
    positionClass: "toast-bottom-right",
    closeButton: true,
    timeOut: 3000, // Duration of the notification in milliseconds
  };
  if (type === 'error') console.error(message);
  if (type === 'success') console.log(message);

  toastr[type](message);
}
$(document).ready(function () {
  showSenderNameModalIfNoSenderName().then(function () {
    // Receive and display new messages
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:7157/api/")
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

  // Start the connection
  // This event is triggered when the connection is established
  connection.start().then(() => {
    $('#viewMessages').append("<p class='message'>SignalR Connected!</p>");
  }).catch((err) => {
    return console.error(err.toString());
  });


  // Receive new message
  // This event is triggered when a new message is received
  connection.on('newMessage', (m) => {
    const decryptedMessage = decryptMessage(m.EncryptedContent, m.Key, m.Iv);

    const messageElement = $("<p>")
      .addClass("message")
      .addClass(m.Sender === senderName ? "userMessage" : "")
      .text(`${m.Sender}: ${decryptedMessage}`);

    $('#viewMessages').append(messageElement);

    // Apply fade-in effect to the new message
    messageElement.fadeIn(500);
  });
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
    console.error("Sender name in localStorage is not set.");
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
function addEventToSendMessage(secretKey, iv, sendBtn = $("#sendBtn"), ) {
  sendBtn.click(function () {
    const inputEl = $('#inputSend')
    const message = inputEl.val();

    // Check if the message is empty
    if (message.trim() === "") {
      // Display an error message or take appropriate action
      console.error("Message is empty. Please enter a message.");
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

    fetch('http://localhost:7157/api/sendMessage', {
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

  console.log("Decrypting message...");

  // Convert the key and iv strings to WordArray objects
  const key = CryptoJS.enc.Utf8.parse(encKey);
  const iv = CryptoJS.enc.Utf8.parse(encIv);

  // Decrypt the message using AES
  const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key, { iv: iv });

  // Convert the decrypted WordArray to a UTF-8 string
  const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);

  console.log("Message decrypted: " + decryptedMessage);

  return decryptedMessage;
}


/**
 * Function to display the encryption key on the website
 * @param {string} key
 * @returns {HTMLElement} keyElement
  */
function displayKeyAndAddEventListener(key) {
  const keyElement = document.createElement("div");
  keyElement.textContent = "Encryption Key: " + key;
  keyElement.style.position = "fixed";
  keyElement.style.bottom = "10px";
  keyElement.style.left = "10px";
  document.body.appendChild(keyElement);


  $(keyElement).on("click", function () {
    navigator.clipboard.writeText(key);
    console.log("Copied key to clipboard.: "+ key);
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
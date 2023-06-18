$(document).ready(async function () {
  showSenderNameModalIfNoSenderName().then(function () {
    // Receive and display new messages
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://${window.location.hostname}:7157/`)
      .configureLogging(signalR.LogLevel.Information)
      .build();


    // Generate RSA key pair
    const rsaKey = new JSEncrypt({ default_key_size: 2048 });
    const publicKey = rsaKey.getPublicKey();

    // Save the public key in localStorage
    localStorage.setItem('publicKey', publicKey);

    // Generating key
    const key = CryptoJS.enc.Utf8.parse(generateRandomKey());
    const iv = CryptoJS.enc.Utf8.parse(generateRandomKey());

    // Convert the key and iv to strings
    const keyString = key.toString();
    const ivString = iv.toString();

    // Save the key and iv to localStorage
    localStorage.setItem('encryptionKey', keyString);
    localStorage.setItem('encryptionIV', ivString);

    //DEBUG: display key in document
    displayKeyAndAddEventListener(key);
    addEventToSendMessage(key, iv);
    initConnectionEvents(connection, getSenderName());
  });

  // Capture the button click event
  const sendKeyButton = document.getElementById("sendKeyButton");
  sendKeyButton.addEventListener("click", function () {

    // Get the senderName, key, and iv from the input elements
    const senderName = document.getElementById("senderNameInput").value;
    const key = localStorage.getItem("key");
    const iv = localStorage.getItem("iv");

    document.getElementById('sendKeyButton').addEventListener('click', searchAndSendKey);

  });


  addEnterEventListenerToInput();
});

/**
 * Function to initialize the connection events
 * @param {HubConnection} connection
 * @param {string} senderName defaults to the saved sender name in localStorage
*/
async function initConnectionEvents(connection, senderName = getSenderName()) {

  const response = await fetch(`http://${window.location.hostname}:7157/negotiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Negotiation failed with status ${response.status}`);
  }

  const negotiationResponse = await response.json();
  const { accessToken, connectionId } = negotiationResponse;


  // Set the access token for the SignalR connection
  connection.accessTokenProvider = () => accessToken;



  // Start the connection
  // This event is triggered when the connection is established
  connection.start().then(() => {
    showNotification('SignalR Connected!', 'success');
  }).catch((err) => {
    return showNotification(err.toString(), 'error');
  });



  // Receive new message
  // This event is triggered when a new message is received
  connection.on('newMessage', (m) => {
    const decryptedMessage = decryptMessage(m.EncryptedContent, m.Key, m.Iv);
    console.log(m.Hash);
    console.log(createHash(decryptedMessage));
    verifyHash(decryptedMessage, m.Hash);
    if (!verifyHash(decryptedMessage, m.Hash)) {
      showNotification('Message has been tampered with!', 'error');
      return;
    }
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





}

 function verifyHash(message, hash) {
  // Calculate the hash of the message
  const calculatedHash = createHash(message);

  // Compare the calculated hash with the provided hash
  return calculatedHash === hash;
}


 function createHash(message) {
  // Convert the message to a WordArray
  const messageWordArray = CryptoJS.enc.Utf8.parse(message);

  // Calculate the SHA256 hash
  const hash = CryptoJS.SHA256(messageWordArray);

  // Convert the hash to a hexadecimal string
  const hashString = hash.toString(CryptoJS.enc.Hex);

  return hashString;
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
      Iv: iv.toString(CryptoJS.enc.Utf8),
      Hash: createHash(message).toString(CryptoJS.enc.Utf8)
    };
    console.log(messageData);

    fetch(`http://${window.location.hostname}:7157/sendMessage`, {
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

const searchAndSendKey = async () => {
  const senderName = document.getElementById('senderNameInput').value;

  // Construct the request body
  const requestBody = JSON.stringify({ senderName });

  try {
    const response = await fetch(`http://${window.location.hostname}:7157/SearchAndSendKey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    if (!response.ok) {
      throw new Error(`Search and Send Key failed with status ${response.status}`);
    }

    console.log('Key and IV sent successfully!');
  } catch (error) {
    console.error('Error sending Key and IV:', error);
  }
};




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
async function removeSenderName() {
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
 * Function to decrypt the message
 * @param {string} encryptedMessage
 * @param {string} encKey
 * @param {string} encIv 
 * @returns {string} decryptedMessage
 */
 function decryptMessage(encryptedMessage, encKey, encIv,) {
  // Convert the key and iv strings to WordArray objects
  const key = CryptoJS.enc.Utf8.parse(encKey);
  const iv = CryptoJS.enc.Utf8.parse(encIv);

  // Decrypt the message using AES
  const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key, { iv: iv });

  // Convert the decrypted WordArray to a UTF-8 string
  const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);

  showNotification('Message decrypted! :\n' + decryptedMessage, 'success');

  return decryptedMessage;
}


/**
 * Function to display the encryption key on the website
 * @param {string} key
 * @returns {HTMLElement} keyElement
  */
async function displayKeyAndAddEventListener(key) {
  const keyElement = document.getElementById('keyElement');
  keyElement.textContent = 'Encryption Key: ' + key;


  $(keyElement).on("click", function () {
    navigator.clipboard.writeText(key);
    showNotification('Copied key to clipboard.', 'success');
  });

  return keyElement;
}


async function addEnterEventListenerToInput(inputEl = $('#inputSend'), sendBtn = $("#sendBtn")) {
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
async function showNotification(message, type) {
  toastr.options = {
    positionClass: "toast-bottom-right",
    closeButton: true,
    timeOut: 3000, // Duration of the notification in milliseconds
  };
  if (type === 'error') console.error(message);
  if (type === 'success') console.log(message);

  toastr[type](message);
}
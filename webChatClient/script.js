$(document).ready(async function () {
  showSenderNameModalIfNoSenderName().then(function () {
    // Receive and display new messages
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://${window.location.hostname}:7157/`)
      .configureLogging(signalR.LogLevel.Information)
      .build();




    // Generate RSA key pair
    const rsaKey = new JSEncrypt({ default_key_size: 512 });
    const publicKey = rsaKey.getPublicKey().toString(CryptoJS.enc.Utf8);
    const privateKey = rsaKey.getPrivateKey().toString(CryptoJS.enc.Utf8);

    localStorage.setItem("recipientPublicKey", "");

    // Save the keys in localStorage
    localStorage.setItem('publicKey', publicKey.toString());
    localStorage.setItem('privateKey', privateKey.toString());
    const recipientPublicKey = getRepripientsPublicKey();

    // Generating key
    const key = CryptoJS.enc.Utf8.parse(generateRandomKey());

    // Convert the key  to strings
    const keyString = key.toString();

    // Save the key to localStorage
    localStorage.setItem('encryptionKey', keyString);

    //DEBUG: display key in document
    displayKeyAndAddEventListener(publicKey);
    addEventToSendMessage();
    initConnectionEvents(connection, getSenderName());
    initializeRecipientPublicKeyField();
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

    if (m.Sender !== senderName) {
      showNotification('Message received!', 'info');
    }
    else {
      showNotification('Message sent!', 'info');
      return;
    }
    console.log(m);

    // Create a new JSEncrypt object for the recipient's public key
    const recipientVerifier = new JSEncrypt();

    // Set the recipient's RSA public key
    recipientVerifier.setPublicKey(localStorage.getItem("recipientPublicKey"));

    // Create a new JSEncrypt object for your private key
    const selfDecryptor = new JSEncrypt();

    // Set your RSA private key
    selfDecryptor.setPrivateKey(localStorage.getItem('privateKey'));
    //console.log('privateKey: ' + localStorage.getItem('privateKey'));

    const decryptedKey = selfDecryptor.decrypt(m.Key);

    const decryptedMessage = decryptMessage(m.EncryptedContent, decryptedKey, m.Iv);
    //console.log(m.Hash);
    //console.log(createHash(decryptedMessage));

    // Set the recipient's RSA public key
    recipientDecryptor.setPublicKey(getRepripientsPublicKey());
    console.log('recipientPublicKey: ' + getRepripientsPublicKey());
    // Decrypt the self-decrypted key using recipient's public key
    const decryptedKeyDouble = recipientDecryptor.decrypt(decryptedKeySelf);
console.log('decryptedKeyDouble: ' + decryptedKeyDouble);

    const decryptedMessage = decryptMessage(m.EncryptedContent, decryptedKeyDouble, m.Iv);
    console.log(m.Hash);
    console.log(createHash(decryptedMessage));
    verifyHash(decryptedMessage, m.Hash);

    if (!verifyHash(decryptedMessage, m.Hash)) {
      showNotification('Message has been tampered with!', 'error');
      return;
    }

    // Verify the signature using the recipient's public key
    const isSignatureValid = recipientVerifier.verify(
      decryptedMessage,
      m.Signature,
      CryptoJS.SHA256
    );

    if (!isSignatureValid) {

      showNotification('Message has been tampered with!', 'error');
      return;
    }

    const messageElement = $("<p>")
      .addClass("message")
      .hide()
      .text(`${m.Sender}: ${decryptedMessage}`);

    // Apply fade-in effect to the new message
    messageElement.fadeIn(500);

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
 * @param {JQuery Object} sendBtn
 * 
*/
function addEventToSendMessage(sendBtn = $("#sendBtn"),) {
  sendBtn.click(function () {

    if (!localStorage.getItem("recipientPublicKey")) {
      showNotification('Please enter the recipient\'s public key', 'error');
      return;
    }
    const inputEl = $('#inputSend')
    const message = inputEl.val();

    //secretKey is the public key of the recipient

    const iv = CryptoJS.enc.Utf8.parse(generateRandomKey());
    // Generating key
    const keyAES = CryptoJS.enc.Utf8.parse(generateRandomKey());
    // Check if the message is empty
    if (message.trim() === "") {
      // Display an error message or take appropriate action
      showNotification('Message is empty. Please enter a message.', 'error');
      return;
    }

    // Create a new JSEncrypt object for your private key
    const selfSigner = new JSEncrypt();

    // Set your RSA private key
    selfSigner.setPrivateKey(localStorage.getItem('privateKey').toString(CryptoJS.enc.Utf8));
    //console.log('privateKey: ' + localStorage.getItem('privateKey'));

    // Sign the data using your private key
    const signature = selfSigner.sign(message, CryptoJS.SHA256, 'sha256');

    // Create a new JSEncrypt object for the recipient's public key
    const recipientEncryptor = new JSEncrypt();

    // Set the recipient's RSA public key
    recipientEncryptor.setPublicKey(localStorage.getItem("recipientPublicKey"));

    //console.log('recipientPublicKey: ' + localStorage.getItem("recipientPublicKey"));
    // Encrypt each quarter of the encrypted key using the recipient's public key
    const encryptedAES = recipientEncryptor.encrypt(keyAES.toString(CryptoJS.enc.Utf8));

    // Encrypt the message
    const encryptedMessage = encryptMessage(message, keyAES, iv);


    const messageData = {
      Sender: getSenderName(),
      EncryptedContent: encryptedMessage,
      Key: encryptedAES,
      Iv: iv.toString(CryptoJS.enc.Utf8),
      Hash: createHash(message).toString(CryptoJS.enc.Utf8),
      Signature: signature
    };
    console.log(messageData);
    console.log(localStorage.getItem("publicKey"));
    fetch(`http://${window.location.hostname}:7157/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    })
      .then(response => console.log(response))

    inputEl.val("");

    const messageElement = $("<p>")
      .addClass("message")
      .addClass("userMessage")
      .hide()
      .text(`${getSenderName()}: ${message}`);

    // Apply fade-in effect to the new message
    messageElement.fadeIn(500);

    $('#viewMessages').append(messageElement);
  });




}

// Function to decrypt the AES key using RSA private key
function decryptAESKey(encryptedKey, privateKey) {
  // Create a new JSEncrypt object
  const decryptor = new JSEncrypt();

  // Set the RSA private key
  decryptor.setPrivateKey(privateKey);

  // Decrypt the encrypted key
  const decryptedKey = decryptor.decrypt(encryptedKey);

  return decryptedKey;
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
 *  get the recipient's public key in localStorage
 * @returns {string} recipientPublicKey
*/
function getRepripientsPublicKey() {
    const recipientPublicKey = localStorage.getItem("recipientPublicKey");
    if (recipientPublicKey === null) {
      showNotification('Recipient\'s public key in localStorage is not set.', 'error');
    }
    return recipientPublicKey;
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

  keyElement.textContent = 'Encryption Key';

  //show the key too
  //keyElement.textContent = 'Encryption Key: ' + key;


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

function initializeRecipientPublicKeyField() {
  // Get the recipient public key field element
  const recipientPublicKeyField = document.getElementById("recipientPublicKeyField");

  // Function to switch to text field
  function switchToTextField() {
    // Create an input element
    // Create a textarea element
    const textareaElement = document.createElement("textarea");
    textareaElement.value = recipientPublicKeyField.innerText;
    textareaElement.placeholder = "Enter the public key";
    textareaElement.className = "public-key-input";
    textareaElement.rows = 4; // Adjust the number of visible rows as needed

    // Replace the field with the textarea element
    recipientPublicKeyField.replaceWith(textareaElement);

    // Focus on the textarea element
    textareaElement.focus();

    // Add event listener to handle Enter key press
    textareaElement.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        confirmPublicKey(textareaElement.value.trim());
      }
    });

  }

  // Function to confirm the public key
  function confirmPublicKey(key) {
    if (key !== "") {
      // Update the field with the confirmed key
      recipientPublicKeyField.innerText = "Recipient's Public Key";
      // Save the recipient's public key to local storage
      localStorage.setItem("recipientPublicKey", key.toString(CryptoJS.enc.Utf8));
      showNotification("Saved new Recipient's Public Key!", 'success');
      //console.log("Recipients key" + key);

    } else {
      // No key entered, revert to the default text
      recipientPublicKeyField.innerText = "NO Recipient's Public Key";
    }
  }

  // Click event handler for the recipient public key field
  recipientPublicKeyField.addEventListener("click", function () {
    switchToTextField();
  });

  // Check if the recipient's public key exists in local storage
  const storedPublicKey = getRepripientsPublicKey();
  if (storedPublicKey) {
    recipientPublicKeyField.innerText = storedPublicKey;
  }
}
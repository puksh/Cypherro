$(document).ready(function () {

  // Receive and display new messages
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:7157/api/")
    .configureLogging(signalR.LogLevel.Information)
    .build();


  // Generating key
  const key = CryptoJS.enc.Utf8.parse(generateRandomKey());
  const iv = CryptoJS.enc.Utf8.parse(generateRandomKey());

  //DEBUG: display key in document
  displayKey(key);

  initConnectionEvents(connection);


  // Modal
  const modal = $("#myModal");
  const span = $(".close");
  const senderNameInput = $("#senderNameInput");
  let senderName = ""; // Store the sender name

  // Show modal with fade-in effect on page load
  modal.fadeIn();

  // Set sender name and close modal with fade-out effect when 'Set' button is clicked
  const setSenderName = function () {
    senderName = senderNameInput.val(); // Update the sender name
    if (senderName) {
      modal.fadeOut(function () {
        $("#senderName").text(senderName);
        sendMessageWithSender(senderName, key, iv);
      });
    }
  };

  $("#setSenderNameBtn").click(setSenderName);

  senderNameInput.keydown(function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      setSenderName();
    }
  });



});

function initConnectionEvents(connection, senderName = "Anonymous") {

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
 * @param {string} senderName
 * @param {string} secretKey
 * 
*/
function sendMessageWithSender(senderName, secretKey, iv) {
  $("#sendBtn").click(function () {
    const message = $('#inputSend').val();

    // Check if the message is empty
    if (message.trim() === "") {
      // Display an error message or take appropriate action
      console.error("Message is empty. Please enter a message.");
      return;
    }

    // Encrypt the message
    const encryptedMessage = encryptMessage(message, secretKey, iv);

    const messageData = {
      Sender: senderName,
      EncryptedContent: encryptedMessage,
      Key: secretKey.toString(CryptoJS.enc.Utf8),
      Iv: iv.toString(CryptoJS.enc.Utf8)
    };
    console.log(messageData);

    $.ajax({
      url: 'http://localhost:7157/api/sendMessage',
      type: 'post',
      data: JSON.stringify(messageData),
      headers: {
        "Content-Type": 'application/json',
      },
      dataType: 'json',
      beforeSend: function (xhr) {
      },
      success: function (response) {
      },
      error: function (xhr, status, error) {
        console.error("AJAX request failed:", error);
      }
    });

    $('#inputSend').val("");
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
function displayKey(key) {
  const keyElement = document.createElement("div");
  keyElement.textContent = "Encryption Key: " + key;
  keyElement.style.position = "fixed";
  keyElement.style.bottom = "10px";
  keyElement.style.left = "10px";
  document.body.appendChild(keyElement);
  return keyElement;
}
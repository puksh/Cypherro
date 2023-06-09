$(document).ready(function() {

// Receive and display new messages
const connection = new signalR.HubConnectionBuilder()
.withUrl("http://localhost:7157/api/")
.configureLogging(signalR.LogLevel.Information)
.build();

connection.start().then(() => {
  $('#viewMessages').append("<p class='message'>SignalR Connected!</p>");
  }).catch((err) => {
  return console.error(err.toString());
});

connection.on('newMessage', (m) => {
  const decryptedMessage = decryptMessage(m.EncryptedContent, m.Key, m.Iv);

  const messageElement = $("<p>")
  .addClass("message")
  .addClass(m.Sender === senderName ? "userMessage" : "")
  .text(m.Sender + ": " + decryptedMessage)
  .hide(); // Initially hide the message

  $('#viewMessages').append(messageElement);

  // Apply fade-in effect to the new message
  messageElement.fadeIn(500);
});

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

// Function to generate a random key
function generateRandomKey(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let x = 0; x < length; x++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return key;
}

// Generating key
var keyLength = 16; // Length of the key in bytes (128 bits)
var key = CryptoJS.enc.Utf8.parse(generateRandomKey(keyLength));
var iv = CryptoJS.enc.Utf8.parse(generateRandomKey(keyLength));


// Function to encrypt the message
function encryptMessage(message, key, iv) {
  // Encrypt the message using AES
  const encrypted = CryptoJS.AES.encrypt(message, key, { iv: iv });

  // Return the encrypted message as a base64-encoded string
  return encrypted.toString();
}

// Display the key on the page
const keyElement = document.getElementById('keyElement');
  keyElement.textContent = 'Encryption Key: ' + key;

// Modal
const modal = $("#myModal");
const span = $(".close");
const senderNameInput = $("#senderNameInput");
let senderName = ""; // Store the sender name

// Show modal with fade-in effect on page load
modal.fadeIn();

// Set sender name and close modal with fade-out effect when 'Set' button is clicked
const setSenderName = function() {
  senderName = senderNameInput.val(); // Update the sender name
  if (senderName) {
    modal.fadeOut(function() {
      $("#senderName").text(senderName);
      sendMessageWithSender(senderName, key);
    });
  }
};

$("#setSenderNameBtn").click(setSenderName);

senderNameInput.keydown(function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    setSenderName();
  }
});


  // Function to send message with sender
function sendMessageWithSender(senderName, secretKey) {
  $("#sendBtn").click(function() {
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
      beforeSend: function(xhr) {
      },
      success: function(response) {
      },
      error: function(xhr, status, error) {
        console.error("AJAX request failed:", error);
      }
    });

    $('#inputSend').val("");
  });
 }
});
const keyElement = document.getElementById("keyElement");
keyElement.addEventListener("click", () => {
  navigator.clipboard.writeText(key)
    .then(() => {
      alert("Encryption Key copied to clipboard!");
    })
    .catch((error) => {
      console.error("Failed to copy Encryption Key:", error);
    });
});
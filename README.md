# Encrypted Chat Application

This project is a web-based encrypted chat application that allows users to send and receive secure messages. It features end-to-end encryption, dark mode, and a responsive design.

## Features

- Real-time messaging using SignalR
- End-to-end encryption using CryptoJS and JSEncrypt
- Dark mode toggle
- Responsive design with a hamburger menu
- Sender name customization
- Public key exchange for secure communication

## Technologies Used

- HTML5
- CSS3
- JavaScript
- jQuery
- SignalR
- CryptoJS
- JSEncrypt
- Forge
- Toastr (for notifications)

## Project Structure

- `index.html`: Main HTML file containing the structure of the chat application
- `styles.css`: CSS file for styling the application (not provided in the snippet)
- `script.js`: JavaScript file for handling application logic (not provided in the snippet)
- `cypher.html`: Page for cypher-related functionality (not provided in the snippet)
- `contact.html`: Contact page (not provided in the snippet)
- `about.html`: About page (not provided in the snippet)

## Security Features

- Messages are encrypted end-to-end using a combination of symmetric and asymmetric encryption.
- Public key exchange is facilitated for secure communication between users.
- The application uses the Forge library for additional cryptographic operations.

## Dependencies

This project uses the following CDN-hosted libraries:

- CryptoJS 4.0.0
- JSEncrypt 3.3.2
- Microsoft SignalR 7.0.7
- jQuery 3.7.0
- Forge 1.3.1
- Toastr (latest version)

Make sure you have an active internet connection for these libraries to load properly.

## Disclaimer

This project is for educational and demonstration purposes. While it implements encryption, always ensure you're using up-to-date security practices in production environments.

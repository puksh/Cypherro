using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;

namespace azureChatty
{
    public static class Function1
    {
        [FunctionName("negotiate")]
        public static async Task<IActionResult> Negotiate(
            [HttpTrigger(AuthorizationLevel.Anonymous, Route = "negotiate")] HttpRequest req,
            [SignalRConnectionInfo(HubName = "trytrytr")] SignalRConnectionInfo connectionInfo)
        {
            // Generate the RSA public key asynchronously
            var rsaKey = await GenerateRSAKeyAsync();

            // Store the public key or perform necessary actions
            string publicKey = rsaKey.PublicKey;

            // Create a response object with connection information and public key
            var response = new
            {
                Url = connectionInfo.Url,
                AccessToken = connectionInfo.AccessToken,
                PublicKey = publicKey
            };

            // Return the connection information and public key in the response body
            return new OkObjectResult(response);
        }

        private static async Task<RSAKeyPair> GenerateRSAKeyAsync()
        {
            // Generate RSA key pair asynchronously
            using (var rsa = new RSACryptoServiceProvider(2048))
            {
                return await Task.FromResult(new RSAKeyPair
                {
                    PublicKey = rsa.ToXmlString(false),
                    PrivateKey = rsa.ToXmlString(true)
                });
            }
        }

        public class RSAKeyPair
        {
            public string PublicKey { get; set; }
            public string PrivateKey { get; set; }
        }
    }
}
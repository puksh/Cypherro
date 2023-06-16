using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Extensions.Logging;

namespace azureChatty
{
    public static class Handshake
    {
        [FunctionName("PerformHandshake")]
        public static async Task<IActionResult> PerformHandshake(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "performHandshake")]
            HttpRequest req, ILogger log,
            [SignalR(HubName = "trytrytr")] IAsyncCollector<SignalRMessage> signalRMessages)
        {

            log.LogInformation("PerformHandshake function triggered.");

            try
            {
                // Retrieve the public key from the request
                string publicKey = req.Form["publicKey"];

                // Store the public key or perform necessary actions

                log.LogInformation("PerformHandshake completed successfully.");
                return new OkResult();
            }
            catch (Exception ex)
            {
                log.LogError($"PerformHandshake error: {ex.Message}");
                return new StatusCodeResult(500);
            }
        }

        [FunctionName("ReceiveHandshake")]
        public static async Task<IActionResult> ReceiveHandshake(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "receiveHandshake")]
            HttpRequest req, ILogger log, [SignalR(HubName = "trytrytr")] IAsyncCollector<SignalRMessage> signalRMessages)
        {
            log.LogInformation("ReceiveHandshake function triggered.");

            try
            {
                // Retrieve the handshake information from the request
                string handshakeInfo = req.Form["handshakeInfo"];

                // Process the handshake information as needed

                log.LogInformation("ReceiveHandshake completed successfully.");
                return new OkResult();
            }
            catch (Exception ex)
            {
                log.LogError($"ReceiveHandshake error: {ex.Message}");
                return new StatusCodeResult(500);
            }
        }
    }
}

using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace azureChatty
{
    public static class Function1
    {
        [FunctionName("negotiate")]
        public static async Task<IActionResult> Negotiate(
            [HttpTrigger(AuthorizationLevel.Anonymous, Route = "negotiate")] HttpRequest req,
            [SignalRConnectionInfo(HubName = "trytrytr")] SignalRConnectionInfo connectionInfo)
        {
            // Create a response object with connection information and public key
            var response = new
            {
                Url = connectionInfo.Url,
                AccessToken = connectionInfo.AccessToken
            };

            // Return the connection information and public key in the response body
            return new OkObjectResult(response);
        }
        [FunctionName("SendPayloadToPlayer")]
        public static IActionResult Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req,
            ILogger log)
        {
            // Read the payload from the request body
            string requestBody = req.ReadAsStringAsync().Result;
            var payload = JsonConvert.DeserializeObject<Payload>(requestBody);

            // Handle the payload and perform necessary actions
            // Here, you can access the key and IV using payload.Key and payload.Iv respectively
            // Implement your logic to process the payload

            // Return an appropriate response
            return new OkResult();
        }

        public class Payload
        {
            public string Key { get; set; }
            public string Iv { get; set; }
        }
    }
}
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.IO;

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


    }
}
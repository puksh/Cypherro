using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;

namespace azureChatty
{
    public static class Function1
    {
        [FunctionName("negotiate")]
        public static SignalRConnectionInfo Negotiate(
            [HttpTrigger(AuthorizationLevel.Anonymous, Route = "negotiate")] HttpRequest req,
            [SignalRConnectionInfo(HubName = "trytrytr")] SignalRConnectionInfo connectionInfo)
        {
            return connectionInfo;
        }
    }
}

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Threading.Tasks;

namespace azureChatty
{


    public static class SendMessage
    {

        [FunctionName("SendMessage")]
        public static async Task<IActionResult> Run(


            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "sendMessage")]
            HttpRequest req,
            ILogger log, [SignalR(HubName = "trytrytr")] IAsyncCollector<SignalRMessage> signalRMessages)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            try
            {
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                Message messageR = JsonConvert.DeserializeObject<Message>(requestBody);

                // Check if Sender and Content are not null
                if (messageR.Sender == null || messageR.EncryptedContent == null)
                {
                    // Handle the case where Sender or Content is null
                    string errorMessage = "Sender and Content are required fields.";
                    return new BadRequestObjectResult(errorMessage);
                }

                Message message = new Message
                {
                    Sender = messageR.Sender,
                    EncryptedContent = messageR.EncryptedContent,
                    Key = messageR.Key,
                    Iv = messageR.Iv
                };
                log.LogInformation("Message created successfully.");

                log.LogInformation("Sending a new message to the 'trytrytr' hub.");
                await signalRMessages.AddAsync(
                    new SignalRMessage
                    {
                        Target = "newMessage",
                        Arguments = new[] { message }
                    });

                log.LogInformation("Message sent successfully.");
                return new OkResult();
            }
            catch (ArgumentNullException ex)
            {
                log.LogError(ex, "ArgumentNullException occurred while sending the message.");

                string errorMessage = "One or more required parameters are missing.";
                int statusCode = 400; // Bad Request

                return new ObjectResult(errorMessage)
                {
                    StatusCode = statusCode
                };
            }
            catch (InvalidOperationException ex)
            {
                log.LogError(ex, "InvalidOperationException occurred while sending the message.");

                string errorMessage = "An invalid operation occurred.";
                int statusCode = 500; // Internal Server Error

                return new ObjectResult(errorMessage)
                {
                    StatusCode = statusCode
                };
            }
            catch (Exception ex)
            {
                log.LogError(ex, "An error occurred while sending the message.");

                string errorMessage = "An error occurred while sending the message. Please try again later.";
                int statusCode = 500; // Internal Server Error

                return new ObjectResult(errorMessage)
                {
                    StatusCode = statusCode
                };
            }


        }



    }


    
}
public class Message
{
    public string Sender { get; set; }
    public string EncryptedContent { get; set; }
    public string Key { get; set; }
    public string Iv { get; set; }
}
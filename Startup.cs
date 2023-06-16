using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection;

[assembly: FunctionsStartup(typeof(azureChatty.Startup))]

namespace azureChatty
{
    public class Startup : FunctionsStartup
    {
        public override void Configure(IFunctionsHostBuilder builder)
        {
            // Configure Kestrel server options
            builder.Services.Configure<KestrelServerOptions>(options =>
            {
                options.AllowSynchronousIO = false;
            });

            // Configure CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("CorsPolicy", policy =>
                {
                    policy.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            builder.Services.AddSignalR();

        }
    }
}
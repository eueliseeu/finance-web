using NeoUI.Blazor.Extensions;
using NeoUI.Blazor.Primitives.Extensions;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);


builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddNeoUIPrimitives();
builder.Services.AddNeoUIComponents();

await builder.Build().RunAsync();

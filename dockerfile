# Use official .NET 8 SDK image for build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything else and build
COPY ./src ./
WORKDIR /src
RUN dotnet restore

WORKDIR /src/Backend
RUN dotnet build 

# Expose ports (change as needed)
EXPOSE 80
EXPOSE 443
EXPOSE 5164

# Set environment variables for production
# ENV ASPNETCORE_URLS="http://+:80;https://+:443"
ENV ASPNETCORE_ENVIRONMENT=Development

# Start the application
ENTRYPOINT ["dotnet", "run", "--profile", "container"]
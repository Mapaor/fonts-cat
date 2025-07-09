# 🚰 Fonts de Catalunya

An interactive map displaying drinking water fountains (`amenity=drinking_water`) across Catalonia, sourced from OpenStreetMap data.

## Features

- 🗺️ Interactive map using Mapbox GL JS
- 📍 Clustered fountain markers for better performance
- 🔍 Click to zoom on clusters
- 💧 Detailed fountain information in popups
- 📱 Responsive design with Tailwind CSS
- 🎯 Focused on Catalonia region

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get a Mapbox Access Token

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create a new access token or use an existing one
3. Copy the access token

### 3. Configure Environment Variables

1. Copy the example environment file:
```bash
copy .env.example .env.local
```

2. Edit `.env.local` and replace `your-mapbox-access-token-here` with your actual Mapbox access token:
```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGthYmNkZWYifQ.your-actual-token
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Data Source

The fountain data (`public/fonts-cat.geojson`) contains drinking water fountains from OpenStreetMap with the tag `amenity=drinking_water` across Catalonia. The data includes both point and polygon geometries, which are automatically converted to points for map visualization.

## Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Mapbox GL JS** - Interactive mapping
- **GeoJSON** - Spatial data format

## Map Features

- **Clustering**: Fountains are automatically clustered at lower zoom levels
- **Interactive Popups**: Click on individual fountains to see details
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Counter**: Shows total number of fountains loaded
- **Catalan Interface**: User interface in Catalan language

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and Mapbox CSS
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main page with MapBox component
└── components/
    └── MapBox.tsx           # Interactive map component
public/
└── fonts-cat.geojson       # GeoJSON data file (1MB+)
```

## Contributing

Feel free to contribute by:
- Improving the UI/UX
- Adding more fountain details
- Optimizing performance
- Adding new features like route planning
- Updating the fountain data

## License

This project uses data from OpenStreetMap, which is available under the Open Database License (ODbL).

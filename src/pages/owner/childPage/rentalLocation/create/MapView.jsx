import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";
import { Card } from "antd";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "on" }]
    }
  ]
};

export default function MapView({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
}) {
  const [center, setCenter] = useState({ lat: latitude, lng: longitude });

  useEffect(() => {
    setCenter({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  const handleMarkerDragEnd = (event) => {
    const newLat = event.latLng.lat();
    const newLng = event.latLng.lng();
    setLatitude(newLat);
    setLongitude(newLng);
  };

  return (
    <Card style={{ borderRadius: "8px", overflow: "hidden" }}>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY}>
        <GoogleMap 
          mapContainerStyle={containerStyle} 
          center={center} 
          zoom={15}
          options={mapOptions}
        >
          <Marker
            position={center}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            animation={2} 
          />
        </GoogleMap>
      </LoadScript>
    </Card>
  );
}

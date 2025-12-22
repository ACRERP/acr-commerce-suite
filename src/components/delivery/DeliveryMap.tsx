import { useLoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Package } from 'lucide-react';

interface Delivery {
    id: number;
    address: string;
    status: string;
    latitude?: number;
    longitude?: number;
    client?: {
        name: string;
    };
}

const mapContainerStyle = {
    width: '100%',
    height: '600px',
};

// Centro padrão (São Paulo)
const defaultCenter = {
    lat: -23.5505,
    lng: -46.6333,
};

export function DeliveryMap() {
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    });

    // Buscar entregas
    const { data: deliveries = [] } = useQuery({
        queryKey: ['deliveries-map'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select(`
          *,
          client:clients(name)
        `)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) throw error;
            return data as Delivery[];
        },
    });

    const center = useMemo(() => {
        if (deliveries.length > 0 && deliveries[0].latitude && deliveries[0].longitude) {
            return {
                lat: deliveries[0].latitude,
                lng: deliveries[0].longitude,
            };
        }
        return defaultCenter;
    }, [deliveries]);

    const getMarkerColor = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
            case 'em_rota':
                return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
            case 'entregue':
                return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
            default:
                return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
        }
    };

    if (!isLoaded) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legenda */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Mapa de Entregas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                            <span className="text-sm">Pendente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                            <span className="text-sm">Em Rota</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-500"></div>
                            <span className="text-sm">Entregue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold">{deliveries.length} entregas</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mapa */}
            <Card>
                <CardContent className="p-0">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        zoom={12}
                        options={{
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: true,
                        }}
                    >
                        {deliveries.map((delivery) => (
                            <Marker
                                key={delivery.id}
                                position={{
                                    lat: delivery.latitude!,
                                    lng: delivery.longitude!,
                                }}
                                icon={getMarkerColor(delivery.status)}
                                onClick={() => setSelectedDelivery(delivery)}
                            />
                        ))}

                        {selectedDelivery && (
                            <InfoWindow
                                position={{
                                    lat: selectedDelivery.latitude!,
                                    lng: selectedDelivery.longitude!,
                                }}
                                onCloseClick={() => setSelectedDelivery(null)}
                            >
                                <div className="p-2">
                                    <h3 className="font-bold text-sm mb-1">
                                        Entrega #{selectedDelivery.id}
                                    </h3>
                                    {selectedDelivery.client && (
                                        <p className="text-xs text-gray-600 mb-1">
                                            Cliente: {selectedDelivery.client.name}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-600 mb-2">
                                        {selectedDelivery.address}
                                    </p>
                                    <Badge
                                        variant={
                                            selectedDelivery.status === 'entregue'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="text-xs"
                                    >
                                        {selectedDelivery.status}
                                    </Badge>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </CardContent>
            </Card>
        </div>
    );
}

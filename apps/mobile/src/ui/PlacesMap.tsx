import MapView, { Marker } from "react-native-maps";
import { palette as c, radius } from "@kickoff/ui-tokens";
import type { ListingCard } from "../lib/types";

const VALAIS = { latitude: 46.22, longitude: 7.5, latitudeDelta: 0.9, longitudeDelta: 1.3 };

export function PlacesMap({ listings, onOpen }: { listings: ListingCard[]; onOpen: (id: string) => void }) {
  return (
    <MapView style={{ flex: 1, minHeight: 440, borderRadius: radius.lg }} initialRegion={VALAIS}>
      {listings.map((l) => (
        <Marker
          key={l.id}
          coordinate={{ latitude: l.lat!, longitude: l.lng! }}
          title={l.title ?? ""}
          description={`${l.company_name}, ${l.commune_name}`}
          pinColor={c.apricot}
          onCalloutPress={() => onOpen(l.id!)}
        />
      ))}
    </MapView>
  );
}

import { AlemanaScraper } from "./alemana";

export class SantaMariaScraper extends AlemanaScraper {
  override readonly clinicId = "santa_maria" as const;
  protected override readonly empresa = "2";

  protected override readonly sucursales: Record<string, string> = {
    "1": "Providencia",
    "2": "La Dehesa",
    "3": "La Reina",
  };
}

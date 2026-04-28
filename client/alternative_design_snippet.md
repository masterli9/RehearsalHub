# Původní prémiový design pozadí z Dashboardu

Tohle je kód z původní verze Dashboardu (kdy onen tmavě fialko/šedý styl vypadal tak dobře). Kdybys jej chtěl v budoucnu implementovat jako výchozí gradientní nebo solitérní barvu pro více částí nebo `PageContainer`, tu je uloženo řešení.

## Kód pro React Native:

```tsx
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Definice barev pro staré prémiové pozadí
const isDark = useColorScheme() === "dark";
const screenBg = isDark ? "#1E1728" : "#F8F8F8"; 

// ... uvnitř metody renderu by obalovací view vypadal takto:
return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: screenBg }}>
        {/* Obsah obrazovky */}
    </SafeAreaView>
)
```

**Poznámka ke vzhledu v Light módu:**
U light módu byla barva jen standardně světla (`#F8F8F8`), tahle výjimečně hezká vizuální změna primárně cílila na Dark mód. U dark módu to dodalo ten pěkný velmi temně fialový prémiový prvek na pozadí, který šel perfektně k aplikaci pro kapely.

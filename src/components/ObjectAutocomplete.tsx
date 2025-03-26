import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { commonObjects } from "@/data/locations";

interface ObjectAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ObjectAutocomplete({
  value,
  onChange,
  placeholder = "Objekt eingeben",
}: ObjectAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customObjects, setCustomObjects] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Lade benutzerdefinierte Objekte aus dem localStorage
  useEffect(() => {
    const storedObjects = localStorage.getItem('customObjects');
    if (storedObjects) {
      try {
        const parsedObjects = JSON.parse(storedObjects);
        setCustomObjects(parsedObjects);
      } catch (error) {
        console.error('Fehler beim Laden der benutzerdefinierten Objekte:', error);
        setCustomObjects([]);
      }
    }
  }, []);

  // Speichere ein neues Objekt im localStorage
  const saveNewObject = (newObject: string) => {
    // Prüfe, ob das Objekt bereits in commonObjects oder customObjects existiert
    const allObjects = [...commonObjects, ...customObjects];
    if (!allObjects.includes(newObject) && newObject.trim() !== '') {
      const updatedCustomObjects = [...customObjects, newObject];
      setCustomObjects(updatedCustomObjects);
      localStorage.setItem('customObjects', JSON.stringify(updatedCustomObjects));
      console.log('Neues Objekt gespeichert:', newObject);
    }
  };

  useEffect(() => {
    // Filter objects based on input
    if (value.length > 0) {
      // Kombiniere vordefinierte und benutzerdefinierte Objekte
      const allObjects = [...commonObjects, ...customObjects];
      const filteredObjects = allObjects.filter((object) =>
        object.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filteredObjects.slice(0, 8)); // Limit auf 8 Vorschläge erhöht
    } else {
      setSuggestions([]);
    }
  }, [value, customObjects]);

  useEffect(() => {
    // Close suggestions when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    // Wenn ein neuer Wert eingegeben wurde, speichere ihn
    if (value.trim() !== '') {
      saveNewObject(value);
    }
    // Verzögere das Ausblenden der Vorschläge, um Klicks zu ermöglichen
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleInputBlur}
        placeholder={placeholder}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-background border border-input rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-accent cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

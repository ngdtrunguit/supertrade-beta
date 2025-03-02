import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    defaultTradeAmount: 100,
    riskLevel: 3,
    defaultSymbols: ["BTCUSDT", "ETHUSDT"],
    theme: "light",
  });

  const handleSaveSettings = () => {
    // Implement save settings logic
    console.log("Saving settings:", settings);
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Trading Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default Trade Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Default Trade Amount (USDT)
            </label>
            <Input
              type="number"
              value={settings.defaultTradeAmount}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  defaultTradeAmount: Number(e.target.value),
                }))
              }
            />
          </div>

          {/* Risk Level */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Risk Level</label>
            <Select
              value={settings.riskLevel.toString()}
              onValueChange={(val) =>
                setSettings((prev) => ({
                  ...prev,
                  riskLevel: Number(val),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Conservative</SelectItem>
                <SelectItem value="2">2 - Conservative</SelectItem>
                <SelectItem value="3">3 - Moderate</SelectItem>
                <SelectItem value="4">4 - Aggressive</SelectItem>
                <SelectItem value="5">5 - Very Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Symbols */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Default Symbols</label>
            <div className="flex flex-wrap gap-2">
              {["BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT"].map((symbol) => (
                <button
                  key={symbol}
                  className={`px-3 py-1 border rounded ${
                    settings.defaultSymbols.includes(symbol)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultSymbols: prev.defaultSymbols.includes(symbol)
                        ? prev.defaultSymbols.filter((s) => s !== symbol)
                        : [...prev.defaultSymbols, symbol],
                    }))
                  }
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
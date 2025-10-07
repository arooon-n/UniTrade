import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

interface ProductFiltersProps {
  filters: {
    search: string;
    category: string;
    type: string;
    min_price: string;
    max_price: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
}

const categories = [
  "Electronics",
  "Books",
  "Furniture",
  "Clothing",
  "Sports",
  "Vehicles",
  "Others",
];

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <Card className="sticky top-20 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <Filter className="h-4 w-4 text-slate-600" />
          </div>
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <label className="text-sm font-semibold mb-3 block text-gray-700">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-semibold mb-3 block text-gray-700">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="text-sm font-semibold mb-3 block text-gray-700">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
          >
            <option value="">All Types</option>
            <option value="sale">For Sale</option>
            <option value="rental">For Rent</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="text-sm font-semibold mb-3 block text-gray-700">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Min ₹"
              value={filters.min_price}
              onChange={(e) => onFilterChange("min_price", e.target.value)}
              className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
            />
            <Input
              type="number"
              placeholder="Max ₹"
              value={filters.max_price}
              onChange={(e) => onFilterChange("max_price", e.target.value)}
              className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
};

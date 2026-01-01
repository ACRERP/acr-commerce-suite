import { supabase } from './supabaseClient';

export interface RecipeItem {
    id?: string;
    component_id: string;
    quantity: number;
    unit: string;
    component_name?: string; // For display
}

export interface Recipe {
    id?: string;
    product_id: string; // The finished product
    product_name?: string; // For display
    name: string;
    description?: string;
    is_active: boolean;
    items: RecipeItem[];
}

export interface ProductionOrder {
    id?: string;
    product_id: string;
    recipe_id: string;
    quantity_planned: number;
    quantity_produced?: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    start_date?: string;
    end_date?: string;
    notes?: string;
    product_name?: string; // For display
    created_at?: string;
}

export const productionService = {
    /**
     * Get all recipes
     */
    getRecipes: async () => {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                *,
                products (name)
            `)
            .order('name');
        
        if (error) throw error;
        return data.map((r: any) => ({
             ...r,
             product_name: r.products?.name
        })) as Recipe[];
    },

    /**
     * Get details of a specific recipe including ingredients
     */
    getRecipeDetails: async (recipeId: string) => {
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .select('*, products(name)')
            .eq('id', recipeId)
            .single();
        
        if (recipeError) throw recipeError;

        const { data: items, error: itemsError } = await supabase
            .from('recipe_items')
            .select('*, products(name)')
            .eq('recipe_id', recipeId);

        if (itemsError) throw itemsError;

        return {
            ...recipe,
            product_name: recipe.products?.name,
            items: items.map((i: any) => ({
                ...i,
                component_name: i.products?.name
            }))
        } as Recipe;
    },

    /**
     * Create a new technical data sheet (Recipe)
     */
    createRecipe: async (recipe: Recipe) => {
        // 1. Create Recipe Header
        const { data: recipeData, error: recipeError } = await supabase
            .from('recipes')
            .insert([{
                product_id: recipe.product_id,
                name: recipe.name,
                description: recipe.description,
                is_active: recipe.is_active
            }])
            .select()
            .single();

        if (recipeError) throw recipeError;

        // 2. Create Recipe Items
        if (recipe.items && recipe.items.length > 0) {
            const itemsToInsert = recipe.items.map(item => ({
                recipe_id: recipeData.id,
                component_id: item.component_id,
                quantity: item.quantity,
                unit: item.unit
            }));

            const { error: itemsError } = await supabase
                .from('recipe_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return recipeData;
    },

    /**
     * Get production orders
     */
    getProductionOrders: async () => {
        const { data, error } = await supabase
            .from('production_orders')
            .select('*, products(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((po: any) => ({
            ...po,
            product_name: po.products?.name
        })) as ProductionOrder[];
    },

    /**
     * Create a production order
     */
    createProductionOrder: async (order: ProductionOrder) => {
        const { data, error } = await supabase
            .from('production_orders')
            .insert([{
                product_id: order.product_id,
                recipe_id: order.recipe_id,
                quantity_planned: order.quantity_planned,
                status: 'pending',
                notes: order.notes
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update status (e.g., Start, Complete)
     */
    updateOrderStatus: async (orderId: string, status: ProductionOrder['status'], quantityProduced?: number) => {
        const updates: any = { status };
        
        if (status === 'in_progress') {
            updates.start_date = new Date().toISOString();
        }
        
        if (status === 'completed') {
            updates.end_date = new Date().toISOString();
            if (quantityProduced) updates.quantity_produced = quantityProduced;
        }

        const { data, error } = await supabase
            .from('production_orders')
            .update(updates)
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

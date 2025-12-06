import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

function TestComponent() {
    return <div>Hello Test World</div>;
}

describe('Test Setup', () => {
    it('renders correctly', () => {
        render(<TestComponent />);
        expect(screen.getByText('Hello Test World')).toBeInTheDocument();
    });

    it('basic math works', () => {
        expect(1 + 1).toBe(2);
    });
});

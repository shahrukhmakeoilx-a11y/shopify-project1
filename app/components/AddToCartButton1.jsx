
import {CartForm} from '@shopify/hydrogen';
import {useState} from 'react';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}) {
  const [quantity, setQuantity] = useState(1);

  const updatedLines = lines.map((line) => ({
    ...line,
    quantity,
  }));

  const isMinReached = quantity >= 4;

  return (
    <>
      {/* Quantity Selector */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center'}}>
        
        <button
          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
          style={{
            padding: '6px 12px',
            fontSize: '16px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            background: '#f5f5f5',
          }}
        >
          -
        </button>

        <span style={{fontSize: '16px', fontWeight: '600'}}>
          {quantity}
        </span>

        <button
          onClick={() => setQuantity((prev) => prev + 1)}
          style={{
            padding: '6px 12px',
            fontSize: '16px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            background: '#f5f5f5',
          }}
        >
          +
        </button>
      </div>

      {/* Message */}
      {!isMinReached && (
        <p style={{color: 'red', fontSize: '14px', marginBottom: '10px'}}>
          Minimum 4 items required
        </p>
      )}

      <CartForm
        route="/cart"
        inputs={{lines: updatedLines}}
        action={CartForm.ACTIONS.LinesAdd}
      >
        {(fetcher) => (
          <button
            type="submit"
            onClick={onClick}
            disabled={
              disabled ||
              fetcher.state !== 'idle' ||
              !isMinReached
            }
            style={{
              backgroundColor: !isMinReached ? '#ccc' : '#000',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: !isMinReached ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '16px',
              fontWeight: '600',
              transition: '0.3s',
            }}
          >
            {fetcher.state !== 'idle' ? 'Adding...' : children}
          </button>
        )}
      </CartForm>
    </>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */


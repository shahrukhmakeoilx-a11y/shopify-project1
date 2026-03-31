
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {redirect, useLoaderData, useNavigate, useLocation} from 'react-router';
import {useState} from 'react';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  const url = new URL(request.url);

  const min = url.searchParams.get("min");
  const max = url.searchParams.get("max");

  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  let filters = [];

  if (min || max) {
    filters.push({
      price: {
        min: min ? parseFloat(min) : undefined,
        max: max ? parseFloat(max) : undefined,
      },
    });
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        ...paginationVariables,
        filters,
      },
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection} = useLoaderData();


  const navigate = useNavigate();
const location = useLocation();

const [min, setMin] = useState('');
const [max, setMax] = useState('');

const applyFilter = () => {
  const params = new URLSearchParams(location.search);

  if (min) params.set('min', min);
  if (max) params.set('max', max);

  navigate(`?${params.toString()}`);
};

const resetFilter = () => {
  navigate(location.pathname);
};

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>

      <div style={{marginBottom: '20px'}}>
  <h3>Filter by Price</h3>

  <input
    type="number"
    placeholder="Min Price"
    value={min}
    onChange={(e) => setMin(e.target.value)}
  />

  <input
    type="number"
    placeholder="Max Price"
    value={max}
    onChange={(e) => setMax(e.target.value)}
    style={{marginLeft: '10px'}}
  />

  <button onClick={applyFilter} style={{marginLeft: '10px'}}>
    Apply
  </button>

  <button onClick={resetFilter} style={{marginLeft: '10px'}}>
    Reset
  </button>
</div>

      <PaginatedResourceSection
        connection={collection.products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
query Collection(
  $handle: String!
  $filters: [ProductFilter!]
  $first: Int
  $last: Int
  $startCursor: String
  $endCursor: String
) {
  collection(handle: $handle) {
    id
    title
    description
    handle
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      filters: $filters
    ) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
}
${PRODUCT_ITEM_FRAGMENT}
`;

/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */

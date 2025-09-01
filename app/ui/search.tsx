'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  // access parameters of current URL - .../...?page=1&query=pending
  const searchParams = useSearchParams(); 
  // access pathname of current URL - ../../
  const pathname = usePathname();
  // enable navigation between routes within client components
  const { replace } = useRouter();

   // wrap contents with useDebouncedCallback, will run the code once user stopped typing for 300m
  const handleSearch = useDebouncedCallback((term) => {
    // create instance of URLSearchParams with searchParams to allow for params (query) manipulation
    const params = new URLSearchParams(searchParams);
    // reset page to 1 upon new search query
    params.set('page', '1');

    if (term) {
      // manipulate URL's param
      params.set('query', term);
    } else {
      params.delete('query')
    }
    // updates the URL and automatically navigate there without page reloading (utilizes Next.js client-side navigation)
    // eg dashboard/invoices -> dashboard/invoices?query=abc
    replace(`${pathname}?${params.toString()}`);
  }, 300)

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        // call handleSearch() on input change
        onChange={(e) => {
          handleSearch(e.target.value)
        }}
        // set default value to current URL's query
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}

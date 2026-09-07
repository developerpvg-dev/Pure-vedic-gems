/** White-on-black wordmarks from PayGlocal / Razorpay brand kits. */
export function PayGatewayMark({
  kind,
  className = 'h-5',
}: {
  kind: 'razorpay' | 'payglocal';
  className?: string;
}) {
  const src = kind === 'razorpay' ? '/payments/razorpay.png' : '/payments/payglocal.png';
  const alt = kind === 'razorpay' ? 'Razorpay' : 'PayGlocal';
  return (
    <span className="inline-flex items-center rounded-md bg-black px-2 py-1">
      <img src={src} alt={alt} className={`${className} w-auto max-w-[7.5rem]`} />
    </span>
  );
}

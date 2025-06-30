declare module 'react-tinder-card' {
  const TinderCard: any;
  export default TinderCard;
}

declare namespace React {
  function createPortal(
    children: React.ReactNode, 
    container: Element | DocumentFragment, 
    key?: string | null
  ): React.ReactPortal;
}

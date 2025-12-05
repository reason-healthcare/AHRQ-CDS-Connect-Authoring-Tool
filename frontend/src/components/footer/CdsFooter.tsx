import React from 'react';

interface CdsToolLink {
  name: string;
  link: string;
}

const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
  const chunkedArray: T[][] = [];
  for (let index = 0; index < array.length; index += chunkSize) {
    chunkedArray.push(array.slice(index, index + chunkSize));
  }
  return chunkedArray;
};

const cdsToolLinks: CdsToolLink[] = [
  { name: 'CDS Home', link: 'https://cds.ahrq.gov/' },
  { name: 'CDS Connect', link: 'https://cds.ahrq.gov/cdsconnect' },
  { name: 'Evaluation', link: 'https://cds.ahrq.gov/evaluation' },
  { name: 'Resources', link: 'https://cds.ahrq.gov/resources' },
  { name: 'Disclaimer for CDS Connect', link: 'https://cds.ahrq.gov/disclaimer' },
  { name: 'Overview', link: 'https://cds.ahrq.gov/overview' },
  { name: 'Learning Network', link: 'https://cds.ahrq.gov/learning-network' },
  { name: 'Funding Opportunities', link: 'https://cds.ahrq.gov/funding-opportunities' },
  { name: 'Contact Us', link: 'https://cds.ahrq.gov/contact-us' },
  { name: 'Privacy Statement', link: 'https://cds.ahrq.gov/privacy' }
];

interface CdsToolLinksProps {
  className: string;
  numRows: number;
}

const CdsToolLinks: React.FC<CdsToolLinksProps> = ({ className, numRows }) => {
  const cdsToolLinksChunked = chunkArray(cdsToolLinks, numRows);
  return (
    <div className={className}>
      {cdsToolLinksChunked.map((row, index) => (
        <div key={index}>
          {row.map((link, linkIndex) => (
            <a key={`${index}-${linkIndex}`} href={link.link}>
              {link.name}
            </a>
          ))}
        </div>
      ))}
    </div>
  );
};

const CdsFooter: React.FC = () => {
  return (
    <footer className="cds-footer">
      <div className="cds-footer__container">
        <div className="cds-footer__column">
          <div className="cds-footer__header">
            <img src={`${process.env.PUBLIC_URL}/assets/images/cds-connect-logo.png`} height="35" alt="CDS Connect" />{' '}
            Clinical Decision Support (CDS)
          </div>

          <CdsToolLinks className="cds-footer__links footer-wide" numRows={2} />
          <CdsToolLinks className="cds-footer__links footer-mobile" numRows={5} />
        </div>
      </div>
    </footer>
  );
};

export default CdsFooter;



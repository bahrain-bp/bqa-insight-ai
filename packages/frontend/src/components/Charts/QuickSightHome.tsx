import React, { useEffect, useState } from "react";

interface DashboardFrameProps {
  width: string;
  height: string;
  src: string;
  title: string;
}

const DashboardFrame: React.FC<DashboardFrameProps> = ({ width, height, src, title }) => {
  return (
    <iframe
      width={width}
      height={height}
      src={src}
      title={title}
      style={{ border: "none" }}
      allowFullScreen
    ></iframe>
  );
};

interface Dashboard {
  title: string;
  width: string;
  height: string;
  embedUrl: string;
}

const HomeDashboards = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

  useEffect(() => {
    // Replace with your API endpoint to fetch embed URLs.
    fetch("/api/get-dashboard-embed-urls")
      .then((res) => res.json())
      .then((data: Dashboard[]) => setDashboards(data))
      .catch((error) => console.error("Failed to fetch dashboards:", error));
  }, []);

  return (
    <div>
      {dashboards.map((dashboard, index) => (
        <div key={index} style={{ marginBottom: "20px" }}>
          <h2>{dashboard.title}</h2>
          <DashboardFrame
            width={dashboard.width}
            height={dashboard.height}
            src={dashboard.embedUrl}
            title={dashboard.title}
          />
        </div>
      ))}
    </div>
  );
};

export default HomeDashboards;
